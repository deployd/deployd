
test:
		@mocha
		--require should \
		--reporter list \
		--slow 20 \
		--growl \

.PHONY: test