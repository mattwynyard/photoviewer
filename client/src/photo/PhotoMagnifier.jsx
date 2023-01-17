import Magnifier from "react-magnifier";

export default function PhotoMagnifier(props) {
    return <Magnifier src={props.image} width={'85%'} zoomFactor={1.0}/>;
  }