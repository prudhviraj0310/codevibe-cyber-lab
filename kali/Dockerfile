FROM kalilinux/kali-rolling

# Avoid interactive prompts during apt installs
ENV DEBIAN_FRONTEND=noninteractive

# Update and install the exact tools requested by the user
RUN apt-get update && apt-get install -y \
    nmap \
    sqlmap \
    hydra \
    ffuf \
    zaproxy \
    seclists \
    curl \
    wget \
    netcat-traditional \
    iputils-ping \
    zsh \
    && rm -rf /var/lib/apt/lists/*

# Set up wordlists symlink for easier access
RUN ln -s /usr/share/seclists /usr/share/wordlists/seclists

# Set zsh as default
RUN chsh -s /bin/zsh

WORKDIR /root/workspace
CMD ["/bin/zsh"]
