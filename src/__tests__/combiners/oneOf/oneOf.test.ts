import {MDSections} from '../../__helpers__/constants';
import {fs} from '../../__helpers__/virtualFS';
import {runPreset} from '../../run';

describe('oneOf operator', () => {
    beforeEach(async () => {
        fs.reset();
    });

    it('renders oneOf with no parameters in request body', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('empty.md');

        expect(sections[MDSections.REQUEST]).toMatchSnapshot();
    });

    it('renders oneOf with no parameters in response body', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('empty.md');

        expect(sections[MDSections.OK]).toMatchSnapshot();
    });

    it('renders oneOf with other parameters in request body', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('filled.md');

        expect(sections[MDSections.REQUEST]).toMatchSnapshot();
    });

    it('renders oneOf as parameter', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('parameters.md');

        expect(sections[MDSections.REQUEST]).toMatchSnapshot();
    });

    it('renders oneOf in parameters and response', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('parameters.md');

        expect(sections[MDSections.OK]).toMatchSnapshot();
    });

    it('renders each table only one time', async () => {
        await runPreset(__dirname);

        const page = fs.match('parameters.md');

        expect(page).toMatchSnapshot();
    });
});
