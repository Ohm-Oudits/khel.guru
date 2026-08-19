import PlatformFeatureTile from "../../components/platform/PlatformFeatureTile";
import PlatformHero from "../../components/platform/PlatformHero";
import PlatformPage from "../../components/platform/PlatformPage";
import { settingsSections } from "../../config/platformNavigation";

const SettingsHub = () => {
  return (
    <PlatformPage>
      <PlatformHero
        eyebrow="Settings"
        title="Security, preferences, sessions, and verification from one top-level account hub."
        description="Stake keeps account control easy to locate. Khel Guru now has a proper Settings landing page that points into the deeper account subsections already present in the codebase."
        tone="settings"
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {settingsSections.map((section) => (
          <PlatformFeatureTile
            key={section.title}
            to={section.path}
            eyebrow="Settings section"
            title={section.title}
            description={section.description}
          />
        ))}
      </section>
    </PlatformPage>
  );
};

export default SettingsHub;
