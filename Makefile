test:
	@mocha

build:
	node /Users/skawful/Projects/Deployd/dashboard/make build
	rm -rf dashboard
	cp -r /Users/skawful/Projects/Deployd/dashboard/build dashboard

.PHONY: test