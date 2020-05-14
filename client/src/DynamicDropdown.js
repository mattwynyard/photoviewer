export default class DynamicDropdown {
    
    constructor(name) {
        this.name = name;
    }

    setCode(code) {
        this.code = code;
    }

    setData(data) {
        this.data = data
    }

    setChecked() {
        this.unchecked = [];
    }

    setUnChecked(value) {
        this.unchecked.push(value);
    }

    isUnChecked(value) {
        let found = false;
        for (let i = 0; i < this.unchecked.length; i++) {
            if (value === this.unhecked[i])
            found = true;
        }
        return found;
    }

    getCode() {
        return this.code;
    }

    getName() {
        return this.name
    }

    getData() {
        return this.data;
    }
}