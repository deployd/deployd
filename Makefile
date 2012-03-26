test:
	@mocha

build:
	node ../dashboard/make build
	rm -rf dashboard
	cp -r ../dashboard/build dashboard
	
.PHONY: test