# Setup Rust by MeyouOSS - A actions to install rust (obviously)

## Options

| Option         | Required | Description                                              |
| -------------- | -------- | -------------------------------------------------------- |
| `rust-version` | `true`   | The version of rust to install                           |
| `components`   | `false`  | The additional components to install eg. clippy, rustfmt |
| `targets`      | `false`  | The additional targets to install                        |

## Example

A basic example on how to use this action

```yaml
name: Rust

on:
  push:
    branches:
      - main
  pull_request:

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-slim
    steps:
      - name: Setup | Checkout
        uses: actions/checkout@v2
      - name: Setup | Rust
        uses: MeyouOSS/ATiltedTree-setup-rust@v1.0.8
        with:
          rust-version: stable
          components: clippy
      - name: Build | Lint
        run: cargo clippy
  compile:
    name: Compile
    runs-on: ubuntu-latest
    steps:
      - name: Setup | Checkout
        uses: actions/checkout@v2
      - name: Setup | Rust
        uses: MeyouOSS/ATiltedTree-setup-rust@v1.0.8
        with:
          rust-version: stable
      - name: Build | Compile
        run: cargo check
  test:
    name: Test
    strategy:
      matrix:
        os:
          - ubuntu-latest
          - windows-latest
          - macos-latest
        rust:
          - stable
          - beta
          - nightly
    runs-on: ${{ matrix.os }}
    needs: [compile]
    steps:
      - name: Setup | Checkout
        uses: actions/checkout@v2
      - name: Setup | Rust
        uses: MeyouOSS/ATiltedTree-setup-rust@v1.0.8
        with:
          rust-version: ${{ matrix.rust }}
      - name: Build | Compile
        run: cargo test
```
