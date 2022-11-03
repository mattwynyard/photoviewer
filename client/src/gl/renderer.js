const setFootpathRatingColours = (data, value) => {
    let colors = {r: null, g: null, b: null, a: null};
    let _alpha = 1;
    switch(data.grade) {
        case 1:
            colors.r = 0.0; //blue
            colors.g = 0.8;
            colors.b = 0.8;
            colors.a = _alpha;
            break;
        case 2:
            colors.r = 0.0; //green
            colors.g = 0.8;
            colors.b = 0.0;
            colors.a = _alpha;
            break;
        case 3:
            colors.r = 1.0; //yellow
            colors.g = 0.8;
            colors.b = 0.0;
            colors.a = _alpha;
            break;
        case 4:
            colors.r = 1.0; //orange
            colors.g = 0.65;
            colors.b = 0.0;
            colors.a = _alpha;
            break;
        case 5:
            colors.r = 1.0; //red
            colors.g = 0.0;
            colors.b = 1.0;
            colors.a = _alpha;  
            break;
      
        default:
            colors.r = 0.25;
            colors.g = 0.25;
            colors.b = 0.25;
            colors.a = _alpha;
    }
    return colors;
  }

  const setCentreColors = (data, value, colorGradient) => {
    let colors = {r: null, g: null, b: null, a: null};
    let ALPHA = 0.75;
    let index = null;
    let rgb = null;
    let hex = null;
    switch(value) {
      case 'Pavement':
        if (data.pavement.toUpperCase().replace(/\s/g, "") === 'UNSEALED') {
          colors.r = 1.0;
          colors.g = 0.5;
          colors.b = 0.0;
          colors.a = ALPHA;
        } else if (data.pavement.toUpperCase().replace(/\s/g, "") === 'THINSURFACEFLEXIBLE') {
          colors.r = 0.0;
          colors.g = 0.5;
          colors.b = 0.5;
          colors.a = ALPHA;
        }  else if (data.pavement.toUpperCase().replace(/\s/g, "") === 'BRIDGE') {
          colors.r = 0.0;
          colors.g = 0.0;
          colors.b = 0.8;
          colors.a = ALPHA;
        } else if (data.pavement.toUpperCase().replace(/\s/g, "") === 'CONCRETE') {
          colors.r = 0.75;
          colors.g = 0.75;
          colors.b = 0.75;
          colors.a = ALPHA;
        } else {
          colors.r = 0.0;
          colors.g = 0.0;
          colors.b = 0.8;
          colors.a = ALPHA;
        }
      break;
      case 'Structural':
        index = data.structural * 10;
        hex = colorGradient.getColor(index + 1)
        rgb = hexToRgb(hex)
        colors.r = rgb.r / 255;
        colors.g = rgb.g / 255;
        colors.b = rgb.b / 255;
        colors.a = ALPHA;
        break;
      case 'Surface':
        index = data.surface * 10;
        hex = colorGradient.getColor(index + 1)
        rgb = hexToRgb(hex)
        colors.r = rgb.r / 255;
        colors.g = rgb.g / 255;
        colors.b = rgb.b / 255;
        colors.a = ALPHA;
        break;
      case 'Drainage':
        index = data.drainage * 10;
        hex = colorGradient.getColor(index + 1)
        rgb = hexToRgb(hex)
        colors.r = rgb.r / 255;
        colors.g = rgb.g / 255;
        colors.b = rgb.b / 255;
        colors.a = ALPHA;
      break;
    
    default:
      colors.r = 0.25;
      colors.g = 0.25;
      colors.b = 0.25;
      colors.a = ALPHA;
  }
    return colors;
  }

  const setFaultColors = (geometry, type, priorities) => {
    const ALPHA = 1.0
    let colors = {r: null, b: null, g: null, a: null}
    let priority = null;
    if (type === "road") {
      priority = geometry.priority;
    } else {
      priority = geometry.grade;
    }

    if (geometry.status === "active") {
      if(priority === priorities.high) { //magenta
        colors.r = 1.0;
        colors.g = 0.0;
        colors.b = 1.0;
        colors.a = ALPHA;  
      } else if(priority === priorities.med) {
        colors.r = 1.0;
        colors.g = 0.5;
        colors.b = 0.0;
        colors.a = ALPHA;
      } else if (priority === priorities.low) {
        colors.r = 0.0;
        colors.g = 0.8;
        colors.b = 0.0;
        colors.a = ALPHA;
      } else if (priority === 99) {
        colors.r = 0.0;
        colors.g = 0.0;
        colors.b = 1.0;
        colors.a = ALPHA;
      } else {
        colors.r = 0.0;
        colors.g = 0.8;
        colors.b = 0.8;
        colors.a = ALPHA;
      }
    } else if (geometry.status === "programmed") {
      colors.r = 0.5;
      colors.g = 0.5;
      colors.b = 0.5;
      colors.a = ALPHA;
    } else if (geometry.status === "completed") {
      colors.r = 0.75;
      colors.g = 0.75;
      colors.b = 0.75;
      colors.a = ALPHA;
    } else {
      colors.r = 1.0;
      colors.g = 0.0;
      colors.b = 0.0;
      colors.a = ALPHA
    }
    return colors;
}

const hexToRgb = (hex) => {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
      return r + r + g + g + b + b;
    });
  
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

module.exports = { setFootpathRatingColours, setFaultColors, setCentreColors }