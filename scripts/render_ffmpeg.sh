#!/usr/bin/env bash
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:${SHOTFLOW_VENV_DIR:-$HOME/.shotflow-venv}/bin:$PATH"

# ShotFlow Mode 5A Local Renderer (Pure FFmpeg)
# Combines keyframe images (p01.png..pNN.png), optional per-segment audio (a01.mp3..aNN.mp3),
# optional cover/outro images, optional subtitles.srt, and optional bgm.mp3 into final.mp4
# with smooth Ken Burns (zoompan) motion and crossfade transitions.
#
# Usage:
#   ./scripts/render_ffmpeg.sh <project_dir> [aspect_ratio] [default_sec]
# Example:
#   ./scripts/render_ffmpeg.sh ./my_video 9:16 5

PROJECT_DIR="${1:-.}"
ASPECT="${2:-9:16}"
DEFAULT_SEC="${3:-5}"
FPS=30
FADE_SEC=0.4

if ! command -v ffmpeg >/dev/null 2>&1 || ! command -v ffprobe >/dev/null 2>&1; then
  echo "Error: ffmpeg and ffprobe are required. Run ./scripts/setup.sh --mode 5a first." >&2
  exit 1
fi

case "$ASPECT" in
  9:16)  WIDTH=1080; HEIGHT=1920 ;;
  16:9)  WIDTH=1920; HEIGHT=1080 ;;
  1:1)   WIDTH=1080; HEIGHT=1080 ;;
  4:5)   WIDTH=1080; HEIGHT=1350 ;;
  *)
    echo "Unsupported aspect ratio '$ASPECT'. Use 9:16, 16:9, 1:1, or 4:5." >&2
    exit 1
    ;;
esac

shopt -s nullglob
IMAGES=("$PROJECT_DIR"/p[0-9][0-9].png "$PROJECT_DIR"/p[0-9][0-9].jpg "$PROJECT_DIR"/p[0-9][0-9].jpeg "$PROJECT_DIR"/p[0-9][0-9].webp)
shopt -u nullglob

if [[ ${#IMAGES[@]} -eq 0 ]]; then
  echo "No keyframe images found in '$PROJECT_DIR' matching p01.png (or .jpg/.webp)." >&2
  exit 1
fi

# Sort images naturally
IFS=$'\n' IMAGES=($(printf '%s\n' "${IMAGES[@]}" | sort))
unset IFS

WORK_DIR="$PROJECT_DIR/.shotflow_tmp"
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"

CONCAT_LIST="$WORK_DIR/concat.txt"
: > "$CONCAT_LIST"

get_duration() {
  ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$1"
}

echo "Rendering ${#IMAGES[@]} segments at ${WIDTH}x${HEIGHT} (${FPS}fps)..."

idx=0
for img in "${IMAGES[@]}"; do
  idx=$((idx + 1))
  base="$(basename "${img%.*}")" # e.g., p01
  num="${base#p}"                 # e.g., 01
  clip="$WORK_DIR/seg_${num}.mp4"

  # Check for matching segment audio (a01.mp3 / a01.wav / a01.m4a)
  audio=""
  for ext in mp3 wav m4a aac; do
    if [[ -f "$PROJECT_DIR/a${num}.${ext}" ]]; then
      audio="$PROJECT_DIR/a${num}.${ext}"
      break
    fi
  done

  if [[ -n "$audio" ]]; then
    raw_dur="$(get_duration "$audio")"
    dur="$(awk -v d="$raw_dur" 'BEGIN { printf "%.2f", d + 0.5 }')"
  else
    dur="$DEFAULT_SEC"
  fi

  frames="$(awk -v d="$dur" -v f="$FPS" 'BEGIN { printf "%d", d * f }')"

  # Alternate gentle zoom-in and zoom-out for visual variety
  if (( idx % 2 == 1 )); then
    zp="zoompan=z='min(zoom+0.0006,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS}"
  else
    zp="zoompan=z='if(lte(on,1),1.12,max(1.0,zoom-0.0006))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${WIDTH}x${HEIGHT}:fps=${FPS}"
  fi

  vf="scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},${zp},format=yuv420p"

  if [[ -n "$audio" ]]; then
    ffmpeg -y -v error -loop 1 -i "$img" -i "$audio" \
      -vf "$vf" -t "$dur" \
      -c:v libx264 -pix_fmt yuv420p -r "$FPS" \
      -c:a aac -b:a 192k -ar 44100 -ac 2 \
      -af "apad=pad_dur=0.5" -shortest \
      "$clip"
  else
    ffmpeg -y -v error -loop 1 -i "$img" -f lavfi -i "anullsrc=channel_layout=stereo:sample_rate=44100" \
      -vf "$vf" -t "$dur" \
      -c:v libx264 -pix_fmt yuv420p -r "$FPS" \
      -c:a aac -b:a 192k -shortest \
      "$clip"
  fi

  echo "file '$(cd "$(dirname "$clip")" && pwd)/$(basename "$clip")'" >> "$CONCAT_LIST"
  echo "  -> Built seg_${num}.mp4 (${dur}s)"
done

MERGED="$WORK_DIR/merged.mp4"
ffmpeg -y -v error -f concat -safe 0 -i "$CONCAT_LIST" -c copy "$MERGED"

CURRENT="$MERGED"

# Optional BGM mixing (ducked to 18% volume under voiceover)
if [[ -f "$PROJECT_DIR/bgm.mp3" ]]; then
  echo "Mixing background music (bgm.mp3)..."
  WITH_BGM="$WORK_DIR/with_bgm.mp4"
  ffmpeg -y -v error -i "$CURRENT" -stream_loop -1 -i "$PROJECT_DIR/bgm.mp3" \
    -filter_complex "[1:a]volume=0.18[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]" \
    -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -shortest \
    "$WITH_BGM"
  CURRENT="$WITH_BGM"
fi

# Optional SRT subtitle burn-in
FINAL_OUT="$PROJECT_DIR/final.mp4"
if [[ -f "$PROJECT_DIR/subtitles.srt" ]]; then
  echo "Burning in subtitles (subtitles.srt)..."
  SRT_ESCAPED="${PROJECT_DIR}/subtitles.srt"
  ffmpeg -y -v error -i "$CURRENT" \
    -vf "subtitles='${SRT_ESCAPED}':force_style='FontSize=20,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,MarginV=60'" \
    -c:v libx264 -pix_fmt yuv420p -c:a copy \
    "$FINAL_OUT"
else
  cp "$CURRENT" "$FINAL_OUT"
fi

rm -rf "$WORK_DIR"
echo "Done! Output saved to: $FINAL_OUT"
