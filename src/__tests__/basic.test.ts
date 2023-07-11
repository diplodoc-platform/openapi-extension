import {MDSections} from './__helpers__/constants';
import {fs} from './__helpers__/virtualFS';
import {runPreset} from './run';

describe('basci openapi project', () => {
    beforeEach(async () => {
        fs.reset();
    });

    it('renders description', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('basic.md');

        expect(sections[MDSections.TITLE]).toMatchSnapshot();
    });

    it('renders request url', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('basic.md');

        expect(sections[MDSections.REQUEST]).toMatchSnapshot();
    });

    it('renders different components', async () => {
        await runPreset(__dirname);

        const sections = fs.sections('basic.md');

        expect(sections[MDSections.OK]).toMatchSnapshot();
        expect(sections[MDSections.NOT_FOUND]).toMatchSnapshot();
    });
});
