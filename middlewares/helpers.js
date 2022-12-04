exports.adjustFilter = (req, res, next) => {
    const filter = {...req.body};
    const body = {};
    for(let key of Object.keys(filter)) {
        const value = filter[key]?filter[key].toString(): "null";
        if(
            value != "null"&&
            value != "" 
            && value != undefined 
            && value != "undefined" 
            && value != "null"
            && value != "none"
            ) {
                body[key] = filter[key];
        }
    }
    req.body = body;
    next();
}