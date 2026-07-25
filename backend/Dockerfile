# Packaging only for cloud hosts. Simulation logic is unchanged.
FROM rust:1.97-bookworm AS builder

WORKDIR /app
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/neuronet-backend /usr/local/bin/neuronet-backend

ENV PORT=3000
EXPOSE 3000

CMD ["neuronet-backend"]
