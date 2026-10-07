# Direct Social API and worker: one Go binary, FFmpeg and whisper.cpp.

FROM golang:1.26-bookworm AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/social ./cmd/social

FROM debian:bookworm-slim AS whisper
ARG WHISPER_VERSION=v1.9.5
# base (150 MB) is fast; small (500 MB) or medium (1.5 GB) hear better.
ARG WHISPER_MODEL=base
RUN apt-get update && apt-get install -y --no-install-recommends build-essential cmake git ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
RUN git clone --depth 1 --branch ${WHISPER_VERSION} https://github.com/ggml-org/whisper.cpp /whisper
WORKDIR /whisper
RUN cmake -B build -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DGGML_NATIVE=OFF \
  && cmake --build build -j --config Release --target whisper-cli
RUN curl -fsSL -o /ggml-model.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-${WHISPER_MODEL}.bin

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg ca-certificates libgomp1 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=whisper /whisper/build/bin/whisper-cli /usr/local/bin/whisper-cli
COPY --from=whisper /ggml-model.bin /models/whisper.bin
COPY --from=build /out/social /usr/local/bin/social
USER nobody
ENTRYPOINT ["social"]
CMD ["api"]
