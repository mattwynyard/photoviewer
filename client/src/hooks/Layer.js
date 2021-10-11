import { React} from 'react';

function Layer(props) {
    return (
        <Dropdown className="priority" drop='right'>
            <Dropdown.Toggle variant="light" size="sm" >
                {props.}
            </Dropdown.Toggle>
                <Dropdown.Menu className="custommenu">
                {this.state.priorities.map((value, index) =>
                    <div key={`${index}`}>
                    <CustomSVG 
                    login={this.state.login}
                    value={value}
                    reverse={this.state.reverse}
                    >
                    </CustomSVG>
                    <input
                        key={`${index}`} 
                        id={value} 
                        type="checkbox" 
                        //defaultChecked
                        checked={this.isPriorityChecked(value, this.state.filterPriorities, true)} 
                        onChange={(e) => this.changeCheck(e)} 
                        onClick={(e) => this.clickPriority(e, value)}>
                    </input>{" " + value}
                    <br></br>
                    </div> 
                    )}
                </Dropdown.Menu>
            </Dropdown>
    )
}