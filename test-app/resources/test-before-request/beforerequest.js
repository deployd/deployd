switch (event) {
    case "GET":
        if (ctx.query.secretKey !== "secret!") {
            cancel("GET not authorized", 401);
        }
        ctx.query.$limit = 1;
        break;
    case "PUT":
        if (this.data.foo === "bar" && ctx.body.secretKey !== "secret!") {
            cancel("PUT not authorized, data ok", 401);
        } else if (this.data.foo !== "bar") {
            cancel("bad input", 500);
        }
        break;
    case "POST":
        if (this.data.foo === "bar" && ctx.body.secretKey !== "secret!") {
            cancel("POST not authorized, data ok", 401);
        } else if (this.data.foo !== "bar") {
            cancel("bad input", 500);
        }
        break;
}
