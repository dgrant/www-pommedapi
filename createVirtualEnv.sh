#!/bin/sh
rm -rf env
sudo apt-get install libtiff4-dev libjpeg8-dev zlib1g-dev libfreetype6-dev liblcms1-dev libwebp-dev
sudo /usr/local/bin/easy_install-2.7 -U pip
sudo /usr/local/bin/pip2 install --upgrade virtualenv
/usr/local/bin/virtualenv-2.7 env
env/bin/pip install --download-cache=~/.pip-cache -r requirements.txt
patch -d env/lib/python2.7/site-packages/ -p1 < mail-local-hostname3-nodocs.patch
