#!/bin/bash
# sheet.sh out.png in1 in2 ... (2 columns)
out=$1; shift; n=$#; args=""; f=""; i=0
for x in "$@"; do args="$args -i $x"; f="$f[$i]scale=960:-1[s$i];"; i=$((i+1)); done
rows=""; r=0
for ((j=0;j<n;j+=2)); do if ((j+1<n)); then f="$f[s$j][s$((j+1))]hstack[r$r];"; else f="$f[s$j]pad=1920:540[r$r];"; fi; rows="$rows[r$r]"; r=$((r+1)); done
f="$f${rows}vstack=inputs=$r"
ffmpeg -loglevel error -y $args -filter_complex "$f" $out
