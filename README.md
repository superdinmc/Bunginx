# Bunginx

Ok I let it introduce itself here:
```
Bunginx: Fast, lightweight, simple HTTP file server
 bunginx [-phc] [--port <port>] [--cluster <count>] [cwd]
 --port <port: number>      Set the port for Bunginx [-p]
                            - defaults to $PORT or 8000.
 --cluster <count: number>  Set the threads that Bunginx will spawn [-c]
                            - defaults to the CPU core count.
 --help                     Display this message
 [cwd: string]              Directory that Bunginx will run on,
                            - defaults to current directory.
```

## Installation
This installation guide is for **linux users**, for windows [please compile it yourself](#compiling)
- Download the binary [here](https://github.com/superdinmc/Bunginx/raw/main/bunginx) (Or "bunginx" in the repo)
- Put it in PATH somewhere idk
## Compiling
### Prerequisites
Bun installed and is on PATH
### Compilation
- Clone the repository
- Run `bun compile`
- Result will be in `./bunginx`
- (Optional)(**Linux-only**) Apply the application to `/usr/bin` via `bun apply`
## Contribution
Pull requests are welcomed.
## FAQ
### Why is `bunginx` so big?
Bun's [SEA](https://bun.sh/docs/bundler/executables) integrates and compiles the code into a copy of bun runtime itself, resulting in a pretty large file.
However, They will soon make the binary itself smaller.
### How to blacklist a file from Bunginx?
Simply just remove read permission of that file from the user that Bunginx runs from, or just remove the read permission entirely.