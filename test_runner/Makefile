test:
	npm install
	rm -rf node_modules/restlink
	mkdir  node_modules/restlink
	cp -Lr ../*.js         node_modules/restlink
	cp -Lr ../client       node_modules/restlink
	cp -Lr ../core         node_modules/restlink
	cp -Lr ../server       node_modules/restlink
	cp -Lr ../spec         node_modules/restlink
	cp -Lr ../utils        node_modules/restlink
	cp -Lr ../package.json node_modules/restlink
	cp -Lr ../README.md    node_modules/restlink
	cp -Lr ../node_modules node_modules/restlink
	./node_modules/.bin/mocha \
		--debug \
		--reporter nyan \
		--check-leaks \
		--require tests_init.js \
		node_modules/restlink/utils/spec/* \
		node_modules/restlink/core/spec/* \
		node_modules/restlink/server/spec/* \
		node_modules/restlink/server/middleware/spec/* \
		node_modules/restlink/server/adapters/spec/* \
		node_modules/restlink/client/spec/* \
		node_modules/restlink/spec/*


jt:
	rm -rf node_modules/restlink
	mkdir  node_modules/restlink
	cp -Lr ../*.js         node_modules/restlink
	cp -Lr ../client       node_modules/restlink
	cp -Lr ../core         node_modules/restlink
	cp -Lr ../server       node_modules/restlink
	cp -Lr ../spec         node_modules/restlink
	cp -Lr ../utils        node_modules/restlink
	cp -Lr ../package.json node_modules/restlink
	cp -Lr ../README.md    node_modules/restlink
	cp -Lr ../node_modules node_modules/restlink
	./node_modules/.bin/mocha \
		--debug \
		--reporter nyan \
		--check-leaks \
		--require tests_init.js \
		node_modules/restlink/utils/spec/* \
		node_modules/restlink/core/spec/* \
		node_modules/restlink/server/spec/* \
		node_modules/restlink/server/middleware/spec/* \
		node_modules/restlink/server/adapters/spec/* \
		node_modules/restlink/client/spec/* \
		node_modules/restlink/spec/*


.PHONY: test
.PHONY: jt
