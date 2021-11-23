const CustomSVG = (props) => {
    if (!props.reverse) {
      if (props.value === "Grade 1" || props.value === "Priority 1") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="magenta" fill="magenta">
            <circle cx="5" cy="5" r="3" />
          </svg>
          );
      } else if (props.value === "Grade 2" || props.value === "Priority 2") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="darkorange" fill="darkorange">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Grade 3" || props.value === "Priority 3") {
        if (props.login === "chbdc") {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="yellow" fill="yellow">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="limegreen" fill="limegreen">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        }
      } else if (props.value === "Grade 5" || props.value === "Priority 5") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="rgb(0,204,204)" fill="rgb(0,204,204)">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Signage") {
        return (
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="blue" fill="blue">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Programmed") {
        return (
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="gray" fill="gray" opacity="0.8">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Completed") {
        return (
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="lightgray" fill="lightgray" opacity="0.8">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else {
        if (props.value === props.bucket) {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} fill={props.color}>
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} opacity="0.4" fill={props.color}>
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        }
        
      }

    } else {
      if (props.value === "Grade 5" || props.value === "Priority 5") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="magenta" fill="magenta">
            <circle cx="5" cy="5" r="3" />
          </svg>
          );
      } else if (props.value === "Grade 4" || props.value === "Priority 4") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="darkorange" fill="darkorange">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Grade 3" || props.value === "Priority 3") {
        if (props.login === "chbdc") {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="yellow" fill="yellow">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else {
          return ( 
            <svg viewBox="1 1 10 10" x="16" width="16" stroke="limegreen" fill="limegreen">
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        }
        
      } else if (props.value === "Grade 2" || props.value === "Priority 2") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="limegreen" fill="limegreen">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Grade 1" || props.value === "Priority 1") {
        return ( 
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="rgb(0,204,204)" fill="rgb(0,204,204)">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Signage") {
        return (
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="blue" fill="blue">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else if (props.value === "Completed") {
        return (
          <svg viewBox="1 1 10 10" x="16" width="16" stroke="grey" fill="grey" opacity="0.8">
            <circle cx="5" cy="5" r="3" />
          </svg>
        );
      } else {
        if (props.value === props.bucket) {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} fill={props.color}>
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        } else {
          return (
            <svg viewBox="1 1 10 10" x="16" width="16" stroke={props.color} opacity="0.4" fill={props.color}>
              <circle cx="5" cy="5" r="3" />
            </svg>
          );
        }
        
      }
    }   
  }

  export {CustomSVG}