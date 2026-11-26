#!/usr/bin/env bash
set -euo pipefail
export PATH="/opt/homebrew/bin:/usr/local/bin:${SHOTFLOW_VENV_DIR:-$HOME/.shotflow-venv}/bin:$PATH"

# ShotFlow Local Render Setup Script
# Installs and verifies local dependencies for Mode 5A (FFmpeg + TTS) and Mode 5B (Code-Rendered Motion Graphics).
# Usage:
#   ./scripts/setup.sh --check
#   ./scripts/setup.sh --mode 5a
#   ./scripts/setup.sh --mode 5b
#   ./scripts/setup.sh --mode all [--with-remotion]

MODE="all"
CHECK_ONLY=false
WITH_REMOTION=false
VENV_DIR="${SHOTFLOW_VENV_DIR:-$HOME/.shotflow-venv}"

usage() {
  cat <<'EOF'
ShotFlow Local Setup Script

Usage:
  ./scripts/setup.sh [options]

Options:
  --mode <5a|5b|all>   Target workflow mode (default: all)
                         5a  = FFmpeg + Python edge-tts (Images + Ken Burns + TTS + SRT -> MP4)
                         5b  = FFmpeg + Node.js + Playwright/Remotion (Code-rendered -> MP4)
                         all = Install dependencies for both 5a and 5b
  --with-remotion      Also scaffold/verify Remotion CLI support for Mode 5b
  --check              Check current environment without installing anything
  -h, --help           Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    --with-remotion)
      WITH_REMOTION=true
      shift
      ;;
    --check)
      CHECK_ONLY=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1" >&2
      usage
      exit 1
      ;;
  esac
done

if [[ "$MODE" != "5a" && "$MODE" != "5b" && "$MODE" != "all" ]]; then
  echo "Invalid --mode: '$MODE'. Expected: 5a, 5b, or all." >&2
  exit 1
fi

OS="$(uname -s)"
has_cmd() { command -v "$1" >/dev/null 2>&1; }

print_status() {
  local label="$1"
  local ok="$2"
  local detail="$3"
  if [[ "$ok" == "true" ]]; then
    printf "  [OK]   %-14s %s\n" "$label" "$detail"
  else
    printf "  [MISS] %-14s %s\n" "$label" "$detail"
  fi
}

check_env() {
  local missing=0
  echo "=== ShotFlow Environment Check ($OS) ==="

  if has_cmd ffmpeg && has_cmd ffprobe; then
    print_status "ffmpeg" "true" "$(ffmpeg -version | head -n 1)"
  else
    print_status "ffmpeg" "false" "Required for Mode 5A & 5B"
    missing=1
  fi

  if [[ "$MODE" == "5a" || "$MODE" == "all" ]]; then
    if has_cmd python3; then
      print_status "python3" "true" "$(python3 --version)"
    else
      print_status "python3" "false" "Required for edge-tts in Mode 5A"
      missing=1
    fi

    if [[ -x "$VENV_DIR/bin/edge-tts" ]]; then
      print_status "edge-tts" "true" "$VENV_DIR/bin/edge-tts"
    elif has_cmd edge-tts; then
      print_status "edge-tts" "true" "$(command -v edge-tts)"
    else
      if [[ "$OS" == "Darwin" ]] && has_cmd say; then
        print_status "edge-tts" "false" "Not installed (macOS 'say' fallback available)"
      else
        print_status "edge-tts" "false" "Recommended neural TTS for Mode 5A"
      fi
      missing=1
    fi
  fi

  if [[ "$MODE" == "5b" || "$MODE" == "all" ]]; then
    if has_cmd node && has_cmd npm; then
      print_status "node / npm" "true" "node $(node -v), npm $(npm -v)"
    else
      print_status "node / npm" "false" "Required for Mode 5B (HTML/Canvas or Remotion)"
      missing=1
    fi

    if has_cmd npx; then
      print_status "npx" "true" "$(command -v npx)"
    else
      print_status "npx" "false" "Required to run Playwright / Remotion CLI"
      missing=1
    fi
  fi

  return "$missing"
}

if [[ "$CHECK_ONLY" == "true" ]]; then
  if check_env; then
    echo "All checked dependencies are ready."
    exit 0
  else
    echo "Some dependencies are missing. Run: ./scripts/setup.sh --mode $MODE"
    exit 1
  fi
fi

install_pkg() {
  local brew_pkg="$1"
  local apt_pkg="$2"

  if [[ "$OS" == "Darwin" ]]; then
    if ! has_cmd brew; then
      echo "Homebrew is not installed. Install it from https://brew.sh and re-run this script." >&2
      exit 1
    fi
    brew install "$brew_pkg"
  elif [[ "$OS" == "Linux" ]]; then
    if has_cmd apt-get; then
      if [[ "$(id -u)" -eq 0 ]]; then
        apt-get update && apt-get install -y "$apt_pkg"
      else
        sudo apt-get update && sudo apt-get install -y "$apt_pkg"
      fi
    else
      echo "Unsupported Linux package manager. Please install '$apt_pkg' manually." >&2
      exit 1
    fi
  else
    echo "Unsupported OS: $OS. Please install '$brew_pkg' manually." >&2
    exit 1
  fi
}

echo "=== Installing ShotFlow dependencies (mode: $MODE) ==="

# 1. FFmpeg (required for both 5A and 5B)
if ! has_cmd ffmpeg || ! has_cmd ffprobe; then
  echo "-> Installing ffmpeg..."
  install_pkg "ffmpeg" "ffmpeg"
else
  echo "-> ffmpeg already installed."
fi

# 2. Mode 5A: Python 3 + edge-tts in isolated venv
if [[ "$MODE" == "5a" || "$MODE" == "all" ]]; then
  if ! has_cmd python3; then
    echo "-> Installing python3..."
    install_pkg "python" "python3 python3-venv"
  fi
  if [[ ! -x "$VENV_DIR/bin/edge-tts" ]] && ! has_cmd edge-tts; then
    echo "-> Creating isolated virtualenv at $VENV_DIR and installing edge-tts..."
    python3 -m venv "$VENV_DIR"
    "$VENV_DIR/bin/pip" install --upgrade pip >/dev/null
    "$VENV_DIR/bin/pip" install edge-tts
  else
    echo "-> edge-tts already installed."
  fi
fi

# 3. Mode 5B: Node.js / npm (+ optional Playwright / Remotion)
if [[ "$MODE" == "5b" || "$MODE" == "all" ]]; then
  if ! has_cmd node || ! has_cmd npm; then
    echo "-> Installing Node.js..."
    install_pkg "node" "nodejs npm"
  else
    echo "-> Node.js already installed ($(node -v))."
  fi

  if [[ "$WITH_REMOTION" == "true" ]]; then
    echo "-> Checking Remotion / Playwright availability..."
    npx --yes remotion --version || true
  fi
fi

echo ""
check_env || true
echo ""
echo "Setup complete! Tip: add '$VENV_DIR/bin' to your PATH to call 'edge-tts' directly."
