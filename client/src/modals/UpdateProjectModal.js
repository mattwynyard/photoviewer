import {Modal, Dropdown}  from 'react-bootstrap';

export function UpdateProjectModal(props) {

return (
    <Modal 
    show={props.props.show} 
    size={'lg'} 
    centered={true}
    onHide={() => props.handleHide()}
    >
    <Modal.Header>
        <div>
            <Modal.Title>Update Project </Modal.Title>
        </div>     
        <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
                {props.props.mode}
            </Dropdown.Toggle>
            <Dropdown.Menu>
            <Dropdown.Item
                onClick={(e) => props.setMode("Insert")}
                >
                Insert
            </Dropdown.Item>
            <Dropdown.Item
                onClick={(e) => props.setMode("Delete")}
                >
                Delete
            </Dropdown.Item>
            </Dropdown.Menu>
        </Dropdown>	
    </Modal.Header>
    <Modal.Body >
    {/* <Form> */}
        <div className="container">
            <label className={"label-client"} 
                htmlFor="client">
                    {"Client:"}
            </label>
            <select 
            className={"select-client"}
            name="client"
            id="client"
            onChange = {(e) => props.changeClient(e.currentTarget.value)}
            >
            {
                props.AddClient.map((client, key) => <option key={key} value={key}>{client}</option>)
            }
            </select>
            <label className={"label-project"} 
                htmlFor="project">
                    {"Project:"}
            </label>
            <select 
            className={"select-project"}
            name="project"
            id="project"
            onChange={(e) => props.changeProject(e.currentTarget.value)}
            >
            {
                props.AddProject.map((project, key) => <option key={key} value={key}>{project.code}</option>)
            }
            </select>
            <label className={"label-description"} 
                htmlFor="description">
                    {"Description:"}
            </label>
            <input 
                type={"text"} 
                id={"description"} 
                name={"description"}
                size='sm'
                placeholder={props.project === null ? "" : props.project.description} 
                onChange={(e) => props.handleTextChange(e)}
            ></input>
            <label className={"label-date"} 
                htmlFor="date">
                    {"Date:"}
            </label>
            <input 
                type={"text"} 
                id={"date"} 
                name={"date"}
                size='sm'
                placeholder={props.project === null ? "" : props.project.date} 
                onChange={(e) => props.handleTextChange(e)}
            ></input>
            <label className={"label-surface"} 
                htmlFor="surface">
                    {"Surface:"}
            </label>
            <input 
                type={"text"} 
                id={"surface"} 
                name={"surface"}
                size='sm'
                placeholder={props.project === null ? "" : props.project.surface} 
                onChange={(e) => props.handleTextChange(e)}
            ></input>
            <label className={"label-amazon"} 
                htmlFor="amazon">
                    {"Amazon:"}
            </label>
            <input 
                type={"text"} 
                id={"amazon"} 
                name={"amazon"}
                size='sm'
                placeholder={props.project === null ? "" : props.project.amazon} 
                onChange={(e) => props.handleTextChange(e)}
            ></input>
            <label className={"label-tacode"} 
                htmlFor="tacode">
                    {"TA Code:"}
            </label>
            <input 
                type={"text"} 
                id={"tacode"} 
                name={"tacode"}
                size='sm'
                placeholder={props.project === null ? "" : props.project.tacode} 
                onChange={(e) => props.handleTextChange(e)}
            ></input>
            <label className={"label-public"} 
                htmlFor="public">
                    {"Public:"}
            </label>
            <input 
                type={"checkbox"} 
                id={"public"} 
                name={"public"}
                size='sm'
                checked={props.project ? props.isPublic : false} 
                onChange={(e) => props.handleCheckboxChange(e)}
            ></input>
            <label className={"label-reverse"} 
                htmlFor="reverse">
                    {"Reverse:"}
            </label>
            <input 
                type={"checkbox"} 
                id={"reverse"} 
                name={"reverse"}
                size='sm'
                checked={props.project ? props.isReverse : false} 
                onChange={(e) => props.handleCheckboxChange(e)}
            ></input>
            <label className={"label-priority"} 
                htmlFor="priority">
                    {"Priority:"}
            </label>
            <input 
                type={"checkbox"} 
                id={"priority"} 
                name={"priority"}
                size='sm'
                checked={props.project ? props.isPriority : false} 
                onChange={(e) => props.handleCheckboxChange(e)}
            ></input>
            <label className={"label-video"} 
                htmlFor="video">
                    {"Video:"}
            </label>
            <input 
                type={"checkbox"} 
                id={"video"} 
                name={"video"}
                size='sm'
                checked={props.project ? props.hasVideo : false} 
                onChange={(e) => props.handleCheckboxChange(e)}
            ></input>
            <label className={"label-ramm"} 
                htmlFor="ramm">
                    {"Ramm:"}
            </label>
            <input 
                type={"checkbox"} 
                id={"ramm"} 
                name={"ramm"}
                size='sm'
                checked={props.project ? props.hasRamm : false} 
                onChange={(e) => props.handleCheckboxChange(e)}
            ></input>
            <label className={"label-centreline"} 
                htmlFor="centreline">
                    {"Centreline:"}
            </label>
            <input 
                type={"checkbox"} 
                id={"centreline"} 
                name={"centreline"}
                size='sm'
                checked={props.project ? props.hasCentreline : false} 
                onChange={(e) => props.handleCheckboxChange(e)}
            ></input>
            <label className={"label-rmclass"} 
                htmlFor="rmclass">
                    {"RM Class:"}
            </label>
            <input 
                type={"checkbox"} 
                id={"rmclass"} 
                name={"rmclass"}
                size='sm'
                checked={props.project ? props.hasRMClass : false} 
                onChange={(e) => props.handleCheckboxChange(e)}
            ></input>
            <input 
                type={"button"} 
                size='sm'
                value={"submit"}
                disabled={props.buttonDisabled}
                onClick={(e) => props.updateProject('update')}
            ></input>
        </div>
    
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
    </Modal>
);
}