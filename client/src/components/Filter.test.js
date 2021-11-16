import React from 'react';
import Enzyme, {shallow} from 'enzyme';
import Adapter from 'enzyme-apapter-react-16';
import Filter from './Filter.js';

Enzyme.configure({ adapter: new Adapter() });

describe('Filter', () => {
    it('should be true', () => {
        const foo = true;
        expect(foo).toBe(true)
    });
    
})