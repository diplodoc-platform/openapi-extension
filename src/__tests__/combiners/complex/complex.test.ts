import {MDSections} from '../../__helpers__/constants';
import {fs} from '../../__helpers__/virtualFS';
import {runPreset} from '../../run';

describe('allOf operator', () => {
    beforeEach(async () => {
        fs.reset();
    });

    it('renders in request', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('complex.md');

        expect(sections[MDSections.REQUEST]).toMatchSnapshot();
    });

    it('renders in response', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('complex.md');

        expect(sections[MDSections.OK]).toMatchSnapshot();
    });

});
