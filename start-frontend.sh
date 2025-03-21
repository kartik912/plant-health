#!/bin/bash
export NVM_DIR="/home/kartik/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
cd /home/kartik/Desktop/plant-health/frontend
npm run dev
