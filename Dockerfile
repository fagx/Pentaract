############################################################################################
####  SERVER BUILDER
############################################################################################

FROM rust:latest AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*
COPY ./pentaract .
RUN cargo build --release

############################################################################################
####  UI BUILDER
############################################################################################

FROM node:20-slim AS ui
WORKDIR /app
COPY ./frontend/package*.json ./
RUN npm install
COPY ./frontend .
RUN npm run build

############################################################################################
####  RUNTIME
############################################################################################

FROM debian:bookworm-slim AS runtime
WORKDIR /app
RUN apt-get update && apt-get install -y libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/target/release/pentaract /pentaract
COPY --from=ui /app/dist /ui
ENV PORT=8000
EXPOSE 8000
ENTRYPOINT ["/pentaract"]
