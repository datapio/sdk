#!/bin/sh

set -eux

npm install -g yarn

(cd sources/node/amqp-engine && yarn install && yarn run doc)
(cd sources/node/k8s-operator && yarn install && yarn run doc)

mkdir -p www/static/docs
cp -Rv sources/node/amqp-engine/docs www/static/docs/amqp-engine
cp -Rv sources/node/k8s-operator/docs www/static/docs/k8s-operator

hugo --minify -s www
