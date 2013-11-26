test:
	rm -rf node_modules/restlink
	mkdir node_modules/restlink
	cp -r ../package.json node_modules/restlink
	cp -r ../src node_modules/restlink
	./node_modules/.bin/mocha \
		--debug \
		--reporter nyan \
		--check-leaks \
		--require tests_init.js \
		node_modules/restlink/src/client/spec/* \
		node_modules/restlink/src/core/spec/* \
		node_modules/restlink/src/server/adapters/spec/* \
		node_modules/restlink/src/server/middleware/spec/* \
		node_modules/restlink/src/server/spec/* \
		node_modules/restlink/src/spec/* \
		node_modules/restlink/src/utils/spec/*

run:
	./run.sh

.PHONY: test
