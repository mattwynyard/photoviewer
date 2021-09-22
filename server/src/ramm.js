const ramm = new Map();

ramm.set("MDC_RD_0521", process.env.RAMM_MDC)
ramm.set("RDC_RD_0521", process.env.RAMM_RDC)

module.exports = { 
    getSize: () => {
        return ramm.size;
    },
    getURL: (project) => {
        return ramm.get(project)
    },
    getMap: () => {
        return ramm;
    }
}