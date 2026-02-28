FROM golang:1.25.4-bookworm
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download
COPY . .

# air（開発用ホットリロード）と本番バイナリの両方を用意
RUN go install github.com/air-verse/air@latest
RUN go build -o server .

# デフォルトは本番用（docker-compose で command 上書き可能）
CMD ["./server"]
