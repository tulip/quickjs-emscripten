
.PHONY: FORCE
.PHONY: update-quickjs
.PHONY: build prepack prepare tarball
.PHONY: smoketest-cra smoketest-node
.PHONY: test-all test-dist test-fast
.PHONY: prettier-check

prepack: build
tarball: build/quickjs-emscripten.tgz
prepare: prettier-check tarball test test-dist smoketest-node
build: dist

test-dist: dist
	cd dist &&                                          \
	TS_NODE_TYPE_CHECK=false $(MOCHA)                   \
	  --require source-map-support/register *.test.js

test-fast:
	TS_NODE_TYPE_CHECK=false TEST_NO_ASYNC=true $(MOCHA)

test-all: dist
	TEST_LEAK=1 $(MAKE) test
	TEST_LEAK=1 $(MAKE) test-dist

prettier-check:
	prettier --check .

update-quickjs:
	$(GIT) subtree pull                            \
	  --prefix=$(QUICKJS_ROOT)                     \
	  --squash git@github.com:bellard/quickjs.git  \
	  master

smoketest-node: tarball ./scripts/smoketest-node.sh
	./scripts/smoketest-node.sh

smoketest-cra: tarball ./scripts/smoketest-website.sh
	./scripts/smoketest-website.sh
