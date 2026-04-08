#!/bin/bash
pnpm config set store-dir /home/claude/.pnpm-store
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
