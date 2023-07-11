import {MDSections} from '../../__helpers__/constants';
import {fs} from '../../__helpers__/virtualFS';
import {runPreset} from '../../run';

describe('allOf operator', () => {
    beforeEach(async () => {
        fs.reset();
    });

    it('renders allOf in request', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('allOf.md');

        expect(sections[MDSections.REQUEST]).toMatchSnapshot();
    });

    it('renders allOf in response', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('allOf.md');

        expect(sections[MDSections.OK]).toMatchSnapshot();
    });

});
