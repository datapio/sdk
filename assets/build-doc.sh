#!/bin/sh

set -eux

(cd sources/node/amqp-engine && npm install && npm run doc)
(cd sources/node/k8s-operator && npm install && npm run doc)

mkdir -p www/static/docs
cp -Rv sources/node/amqp-engine/docs www/static/docs/amqp-engine
cp -Rv sources/node/k8s-operator/docs www/static/docs/k8s-operator

hugo --minify -s www
