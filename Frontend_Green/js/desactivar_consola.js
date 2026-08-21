// Desactivar y limpiar la consola
(function () {
    setInterval(() => {
        console.clear();
    }, 100);

    const noop = () => { };
    console.log = noop;
    console.error = noop;
    console.warn = noop;
    console.info = noop;
    console.debug = noop;
    console.trace = noop;
    console.dir = noop;
})();
