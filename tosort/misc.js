

// date of reception. Useful for replay ! (may be overriden by something else if needed)
this.date = new Date();

expect(out.date).to.not.be.undefined;



// then auto values
temp_response.timestamp = new Date();



out.use(BaseMiddleware.make_new(function process(req, res, next) {
	res.set_to_not_implemented("Server is misconfigured. Please add middlewares to handle requests !");
	res.send();
}));
