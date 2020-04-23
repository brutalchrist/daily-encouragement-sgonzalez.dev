#! /bin/bash

shopt -s dotglob
find * -prune -type d | while IFS= read -r d; do 
    msgfmt ./$d/LC_MESSAGES/$d.po -o ./$d/LC_MESSAGES/daily-encouragement@sgonzalez-dev.mo
done