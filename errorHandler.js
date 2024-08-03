const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let statusCode = 500;
    let message = 'Ha ocurrido un error en el servidor';

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Error de validación: ' + err.message;
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Error de conversión: ' + err.message;
    } else if (err.kind === 'ObjectId' && err.path === '_id') {
        statusCode = 404;
        message = 'No se encontró el recurso solicitado';
    } else if (err.code === 11000) {
        statusCode = 409;
        message = 'Error de conflicto: Duplicado de datos';
    }

    res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
