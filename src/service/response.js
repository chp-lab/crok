class ResponseManager {
    constructor(ctx) {
        this.ctx = ctx
    }

    success(data = null, message = null, status = 200) {
        this.ctx.status = status
        return this.ctx.body = {
            status : "success",
            message : message,
            results : data,
        }
    }

    error(message = null, status = 500) {
        this.ctx.status = status;
        return this.ctx.body = {
            status: "error",
            message: message,
            results : null,
        };
    }
}

export default ResponseManager