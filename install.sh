#!/bin/bash

# Script configuration
VERSION="3.2"
LOCKFILE="/tmp/nikkitproxy.lock"
BACKUP_DIR="/root/backups-nikki"
TEMP_DIR="/tmp"
NIKKI_DIR="/etc/nikki"
NIKKI_CONFIG="/etc/config/nikki"

setup_colors() {
    PURPLE="\033[95m"
    BLUE="\033[94m"
    GREEN="\033[92m"
    YELLOW="\033[93m"
    RED="\033[91m"
    MAGENTA='\033[0;35m'
    CYAN='\033[0;36m'
    RESET="\033[0m"

    STEPS="[${PURPLE} STEPS ${RESET}]"
    INFO="[${BLUE} INFO ${RESET}]"
    SUCCESS="[${GREEN} SUCCESS ${RESET}]"
    WARNING="[${YELLOW} WARNING ${RESET}]"
    ERROR="[${RED} ERROR ${RESET}]"

    # Formatting
    CL=$(echo "\033[m")
    UL=$(echo "\033[4m")
    BOLD=$(echo "\033[1m")
    BFR="\\r\\033[K"
    HOLD=" "
    TAB="  "
}

error_msg() {
    local line_number=${2:-${BASH_LINENO[0]}}
    echo -e "${ERROR} ${1} (Line: ${line_number})" >&2
    echo "Call stack:" >&2
    local frame=0
    while caller $frame; do
        ((frame++))
    done >&2
    exit 1
}

spinner() {
    local frames=('⠋' '⠙' '⠹' '⠸' '⠼' '⠴' '⠦' '⠧' '⠇' '⠏')
    local colors=("\033[31m" "\033[33m" "\033[32m" "\033[36m" "\033[34m" "\033[35m" "\033[91m" "\033[92m" "\033[93m" "\033[94m")
    local spin_i=0
    local color_i=0
    local interval=0.1

    if ! sleep $interval 2>/dev/null; then
        interval=1
    fi

    printf "\e[?25l"

    while true; do
        local color="${colors[color_i]}"
        printf "\r ${color}%s${CL}" "${frames[spin_i]}"

        spin_i=$(( (spin_i + 1) % ${#frames[@]} ))
        color_i=$(( (color_i + 1) % ${#colors[@]} ))

        sleep "$interval" 2>/dev/null || sleep 1
    done
}

setup_colors

format_time() {
  local total_seconds=$1
  local hours=$((total_seconds / 3600))
  local minutes=$(( (total_seconds % 3600) / 60 ))
  local seconds=$((total_seconds % 60))
  printf "%02d:%02d:%02d" $hours $minutes $seconds
}

cmdinstall() {
    local cmd="$1"
    local desc="${2:-$cmd}"

    echo -ne "${TAB}${HOLD}${INFO} ${desc}${HOLD}"
    spinner &
    SPINNER_PID=$!
    local start_time=$(date +%s)
    local output=$($cmd 2>&1)
    local exit_code=$?
    local end_time=$(date +%s)
    local elapsed_time=$((end_time - start_time))
    local formatted_time=$(format_time $elapsed_time)

    if [ $exit_code -eq 0 ]; then
        if [ -n "$SPINNER_PID" ] && ps | grep $SPINNER_PID > /dev/null; then kill $SPINNER_PID > /dev/null; fi
        printf "\e[?25h"
        echo -e "${BFR}${SUCCESS} ${desc} ${BLUE}[$formatted_time]${RESET}"
    else
        if [ -n "$SPINNER_PID" ] && ps | grep $SPINNER_PID > /dev/null; then kill $SPINNER_PID > /dev/null; fi
        printf "\e[?25h"
        echo -e "${BFR}${ERROR} ${desc} ${BLUE}[$formatted_time]${RESET}"
        echo "$output"
        exit 1
    fi
}

# Dependency check with more robust verification
check_dependencies() {
    local commands=("unzip" "tar" "curl" "jq" "coreutils-sleep")
    
    # Determine package manager
    if [ -x "/bin/opkg" ]; then
        echo -e "${INFO} Using OpenWrt package manager (opkg)"
        
        for cmd in "${commands[@]}"; do
            if ! opkg list-installed | grep -q "^$cmd "; then
                echo -e "${INFO} Installing missing dependency: $cmd"
                cmdinstall "opkg update" "Updating package lists" || error_msg "Failed to update package lists"
                cmdinstall "opkg install $cmd" "Installing $cmd"
            else
                echo -e "${SUCCESS} $cmd is already installed"
            fi
        done
        
    elif [ -x "/usr/bin/apk" ]; then
        echo -e "${INFO} Using Alpine package manager (apk)"
        
        for cmd in "${commands[@]}"; do
            if ! apk info -e "$cmd" &>/dev/null; then
                echo -e "${INFO} Installing missing dependency: $cmd"
                cmdinstall "apk update" "Updating package lists" || error_msg "Failed to update package lists"
                cmdinstall "apk add $cmd --allow-untrusted" "Installing $cmd"
            else
                echo -e "${SUCCESS} $cmd is already installed"
            fi
        done
        
    else
        error_msg "No supported package manager found"
    fi
    echo -e "${SUCCESS} All dependencies are installed and available"
}

# Enhanced cleanup function
cleanup() {
    echo -e "${INFO} Performing cleanup..."
    rm -f "$LOCKFILE"
    rm -rf "$TEMP_DIR/Config-Open-ClashMeta-main" "$TEMP_DIR/Yacd-meta-gh-pages"
    rm -f "$TEMP_DIR/main.zip" "$TEMP_DIR/gh-pages.zip"
}

# Backup functions with improved error checking
ensure_backup_dir() {
    mkdir -p "$BACKUP_DIR" || error_msg "Failed to create backup directory"
}

perform_backup() {
    ensure_backup_dir
    local current_time=$(date +"%Y-%m-%d_%H-%M-%S")
    local output_tar_gz="$BACKUP_DIR/backup_config_nikki_${current_time}.tar.gz"
    local files_to_backup=(
        "$NIKKI_DIR/mixin.yaml"
        "$NIKKI_DIR/profiles"
        "$NIKKI_DIR/run"
        "$NIKKI_CONFIG"
    )

    echo -e "${INFO} Starting backup process..."
    
    # Validate files before backup
    for file in "${files_to_backup[@]}"; do
        if [[ ! -e "$file" ]]; then
            echo -e "${WARNING} $file does not exist"
        fi
    done

    cmdinstall "tar -czvf $output_tar_gz ${files_to_backup[@]}" "Creating Backup"
    
    echo -e "${INFO} Backup successfully created at: $output_tar_gz"
}

perform_restore() {
    local backup_file="$1"
    [[ -f "$backup_file" ]] || error_msg "Backup file not found: $backup_file"

    echo -e "${INFO} Starting restore process..."
    
    mkdir -p "$NIKKI_DIR/profiles" "$NIKKI_DIR/run" || 
        error_msg "Failed to create directories"
    
    [[ -f "$NIKKI_CONFIG" ]] && cp "$NIKKI_CONFIG" "$NIKKI_CONFIG.bak"

    cmdinstall "tar -tzvf $backup_file -C / --overwrite" "Validating Backup"

    mv "$NIKKI_DIR/nikki" "$NIKKI_CONFIG" &> /dev/null
    chmod 644 "$NIKKI_CONFIG"

    echo -e "${INFO} Restore completed successfully"
}

# Download and install configuration with progress tracking
install_config() {
    echo -e "${INFO} Downloading configuration files..."

    cmdinstall "curl -s -L -o $TEMP_DIR/main.zip https://github.com/antifragile0/Config-Open-ClashMeta/archive/refs/heads/main.zip" "Download Configuration"

    cmdinstall "unzip -o $TEMP_DIR/main.zip -d $TEMP_DIR" "Extract Configuration"
    cd "$TEMP_DIR/Config-Open-ClashMeta-main" || error_msg "Failed to change directory"
    
    mv -f config/Country.mmdb "$NIKKI_DIR/run/Country.mmdb" &> /dev/null && chmod +x "$NIKKI_DIR/run/Country.mmdb"
    mv -f config/GeoIP.dat "$NIKKI_DIR/run/GeoIP.dat" &> /dev/null && chmod +x "$NIKKI_DIR/run/GeoIP.dat"
    mv -f config/GeoSite.dat "$NIKKI_DIR/run/GeoSite.dat" &> /dev/null && chmod +x "$NIKKI_DIR/run/GeoSite.dat"
    if [ ! -d "$NIKKI_DIR/run/proxy_provider" ]; then
        mkdir -p "$NIKKI_DIR/run/proxy_provider"
        mv -f config/proxy_provider/* "$NIKKI_DIR/run/proxy_provider/" &> /dev/null && chmod -R 755 "$NIKKI_DIR/run/proxy_provider"
    fi
    if [ ! -d "$NIKKI_DIR/run/rule_provider" ]; then
        mkdir -p "$NIKKI_DIR/run/rule_provider"
        mv -f config/rule_provider/* "$NIKKI_DIR/run/rule_provider/" &> /dev/null  && chmod -R 755 "$NIKKI_DIR/run/rule_provider"
    fi
    mv -f config/config/* "$NIKKI_DIR/profiles/" &> /dev/null && chmod -R 755 "$NIKKI_DIR/profiles"
    mv -f config/nikki $NIKKI_CONFIG &> /dev/null && chmod 644 $NIKKI_CONFIG
    
    echo -e "${INFO} Installing Yacd dashboard..."
    cd "$TEMP_DIR" || error_msg "Failed to change directory"
    if [[ -f "$TEMP_DIR/gh-pages.zip" ]]; then
        rm -rf "$TEMP_DIR/gh-pages.zip"
    fi
    cmdinstall "curl -s -L -o $TEMP_DIR/gh-pages.zip https://github.com/MetaCubeX/Yacd-meta/archive/refs/heads/gh-pages.zip" "Download Dashboard"

    cmdinstall "unzip -o $TEMP_DIR/gh-pages.zip -d $TEMP_DIR" "Extract Dashboard"
    if [[ -d "$NIKKI_DIR/run/ui/dashboard" ]]; then
        rm -rf "$NIKKI_DIR/run/ui/dashboard"
    fi
    mv -fT "$TEMP_DIR/Yacd-meta-gh-pages" "$NIKKI_DIR/run/ui/dashboard" || error_msg "Failed to install dashboard"
    echo -e "${INFO} Configuration installation completed successfully!"
}

# System information function
system_info() {
    clear
    printf "\033[0;34m╔═══════════════════════════════════════════╗\033[0m\n"
    printf "\033[0;34m║\033[1;36m         System Information Details        \033[0;34m║\033[0m\n"
    printf "\033[0;34m╠═══════════════════════════════════════════╣\033[0m\n"

    # Hostname
    printf "\033[0;32m » Hostname:\033[0m \033[1;33m%s\033[0m\n" "$(cat /proc/sys/kernel/hostname)"

    # Operating System
    os_info=$(cat /etc/openwrt_release | grep DISTRIB_DESCRIPTION | cut -d\' -f2)
    printf "\033[0;32m » OS:\033[0m \033[1;33m%s\033[0m\n" "$os_info"

    # Kernel Version
    printf "\033[0;32m » Kernel:\033[0m \033[1;33m%s\033[0m\n" "$(uname -r)"

    # Architecture
    printf "\033[0;32m » Architecture:\033[0m \033[1;33m%s\033[0m\n" "$(uname -m)"

    # Uptime
    uptime_info=$(cat /proc/uptime | awk '{printf "%d days, %d hours, %d minutes", 
        int($1/86400), int(($1%86400)/3600), int(($1%3600)/60)}')
    printf "\033[0;32m » Uptime:\033[0m \033[1;33m%s\033[0m\n" "$uptime_info"

    printf "\033[0;34m╠═══════════════════════════════════════════╣\033[0m\n"

    # Memory Information
    total=$(awk '/MemTotal/ {print $2}' /proc/meminfo)
    free=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
    used=$((total - free))
    memory_percent=$(awk "BEGIN {printf \"%.1f\", ($used/$total)*100}")

    printf "\033[0;32m » Total Memory:\033[0m \033[1;33m%d MB\033[0m\n" $((total/1024))
    printf "\033[0;32m » Used Memory:\033[0m \033[1;33m%d MB (%s%%)\033[0m\n" $((used/1024)) "$memory_percent"
    printf "\033[0;32m » Free Memory:\033[0m \033[1;33m%d MB\033[0m\n" $((free/1024))

    printf "\033[0;34m╠═══════════════════════════════════════════╣\033[0m\n"

    # Disk Usage
    root_usage=$(df / | awk '/\// {print $5}')
    root_total=$(df / | awk '/\// {print $2/1024}')
    root_used=$(df / | awk '/\// {print $3/1024}')

    printf "\033[0;32m » Disk Total:\033[0m \033[1;33m%.1f MB\033[0m\n" "$root_total"
    printf "\033[0;32m » Disk Used:\033[0m \033[1;33m%.1f MB (%s)\033[0m\n" "$root_used" "$root_usage"

    printf "\033[0;34m╚═══════════════════════════════════════════╝\033[0m\n"
}

install_nikki() {
    echo -e "${INFO} Starting Nikki-TProxy installation..."

    # Check environment
    if [[ ! -x "/bin/opkg" && ! -x "/usr/bin/apk" || ! -x "/sbin/fw4" ]]; then
        error_msg "System requirements not met. Only supports OpenWrt build with firewall4!"
    fi

    # Include openwrt_release
    if [[ ! -f "/etc/openwrt_release" ]]; then
        error_msg "OpenWrt release file not found"
    fi
    . /etc/openwrt_release

    # Get branch/arch
    arch="$DISTRIB_ARCH"
    [[ -z "$arch" ]] && error_msg "Could not determine system architecture"
    
    # Determine branch
    case "$DISTRIB_RELEASE" in
        *"23.05"*)
            branch="openwrt-23.05"
            ;;
        *"24.10"*)
            branch="openwrt-24.10"
            ;;
        "SNAPSHOT")
            branch="SNAPSHOT"
            ;;
        *)
            error_msg "Unsupported OpenWrt release: $DISTRIB_RELEASE"
            ;;
    esac

    # Create temporary directory for downloads
    local temp_dir=$(mktemp -d)
    [[ ! -d "$temp_dir" ]] && error_msg "Failed to create temporary directory"
    
    # Download tarball
    echo -e "${INFO} Downloading Nikki-TProxy package..."
    local tarball="nikki_$arch-$branch.tar.gz"
    local download_url="https://github.com/antifragile0/OpenWrt-nikki-Mod/releases/latest/download/$tarball"
    
    cmdinstall "curl -s -L -o $temp_dir/$tarball $download_url" "Download Package"

    # Extract tarball
    cmdinstall "tar -xzf $temp_dir/$tarball -C $temp_dir" "Extract Package"

    # Install packages based on package manager
    if [ -x "/bin/opkg" ]; then
        cmdinstall "opkg update" "Update Package"
        cd "$temp_dir" || error_msg "Failed to change to temporary directory"
        cmdinstall "opkg install $temp_dir/nikki_*.ipk" "Install Mihomo Package"
        cmdinstall "opkg install $temp_dir/luci-app-nikki_*.ipk" "Install Luci Package"
    elif [ -x "/usr/bin/apk" ]; then
        cmdinstall "apk update" "Update Package"
        cd "$temp_dir" || error_msg "Failed to change to temporary directory"
        cmdinstall "apk add --allow-untrusted $temp_dir/nikki-*.apk" "Install Mihomo Package"
        cmdinstall "apk add --allow-untrusted $temp_dir/luci-app-nikki-*.apk" "Install Luci Package"
    fi

    # Cleanup
    rm -rf "$temp_dir"
    echo -e "${INFO} Nikki-TProxy installation completed successfully!"
}

uninstall_nikki() {
    echo -e "${INFO} Starting Nikki-TProxy uninstallation..."

    # Create backup before uninstalling
    local backup_name="pre_uninstall_backup_$(date +%Y%m%d_%H%M%S)"
    echo -e "${INFO} Creating backup before uninstallation..."
    perform_backup

    # Remove packages based on package manager
    if [ -x "/bin/opkg" ]; then
        cmdinstall "opkg remove luci-app-nikki" "Remove Luci Package"
        cmdinstall "opkg remove nikki" "Remove Mihomo Package"
    elif [ -x "/usr/bin/apk" ]; then
        cmdinstall "apk del luci-app-nikki" "Remove Luci Package"
        cmdinstall "apk del nikki" "Remove Mihomo Package"
    else
        error_msg "No supported package manager found"
    fi

    # Remove configuration files
    echo -e "${INFO} Removing configuration files..."
    if [ -d "/etc/nikki" ]; then
        rm -rf "/etc/nikki" || echo -e "${WARNING} Failed to remove /etc/nikki directory"
    fi
    
    if [ -f "/etc/config/nikki" ]; then
        rm -f "/etc/config/nikki" || echo -e "${WARNING} Failed to remove /etc/config/nikki file"
    fi

    echo -e "${INFO} Nikki-TProxy uninstallation completed successfully!"
    echo -e "${INFO} A backup was created before uninstallation in case you need to restore later."
}

# Display menu with system info option
display_menu() {
    clear
    printf "\033[0;34m╔═══════════════════════════════════════════╗\033[0m\n"
    printf "\033[0;34m║\033[0;32m         Auto Script | Nikki-TProxy        \033[0;34m║\033[0m\n"
    printf "\033[0;34m╠═══════════════════════════════════════════╣\033[0m\n"
    printf "\033[1;33m    [*]\033[0m   Auto Script By : \033[0;31mRizkiKotet\033[0m   \033[1;33m[*]\033[0m\n"
    printf "\033[0;32m                 Version: \033[1;33m$VERSION\033[0m\n\n"
    
    printf "\033[0;34m╠═══════════════════════════════════════════╣\033[0m\n"
    printf "\033[0;32m >> NIKKI MENU\033[0m\n"
    printf " > \033[1;33m1\033[0m - \033[0;34mInstall Nikki-TProxy\033[0m\n\n"
    printf " > \033[1;33m2\033[0m - \033[0;34mUninstall Nikki-TProxy\033[0m\n\n"

    printf "\033[0;32m >> BACKUP MENU\033[0m\n"
    printf " > \033[1;33m3\033[0m - \033[0;34mBackup Full Config\033[0m\n\n"
    
    printf "\033[0;32m >> RESTORE MENU\033[0m\n"
    printf " > \033[1;33m4\033[0m - \033[0;34mRestore Backup Full Config\033[0m\n\n"
    
    printf "\033[0;32m >> CONFIG MENU\033[0m\n"
    printf " > \033[1;33m5\033[0m - \033[0;34mDownload Full Backup Config By RTA-WRT\033[0m\n\n"
    
    printf "\033[0;32m >> SYSTEM INFO\033[0m\n"
    printf " > \033[1;33m6\033[0m - \033[0;34mDisplay System Information\033[0m\n"
    
    printf "\033[0;34m╠═══════════════════════════════════════════╣\033[0m\n"
    printf " > \033[0;31mX\033[0m - Exit Script\n"
    printf "\033[0;34m╚═══════════════════════════════════════════╝\033[0m\n"
}

main() {
    [[ -f "$LOCKFILE" ]] && error_msg "Script is already running"

    touch "$LOCKFILE" || error_msg "Failed to create lock file"
    trap cleanup EXIT

    check_dependencies

    while true; do
        display_menu
        read -r choice

        case "$choice" in
            1) install_nikki ;;
            2) uninstall_nikki ;;
            3) perform_backup ;;
            4) 
                read -p "Enter backup file path: " backup_file
                perform_restore "$backup_file"
                ;;
            5) install_config ;;
            6) system_info ;;
            [xX]) 
                echo -e "${INFO} Exiting..."
                exit 0 
                ;;
            *) 
                echo -e "${WARNING} Invalid option selected!" 
                ;;
        esac

        read -p "Press Enter to continue..."
    done
}

main
