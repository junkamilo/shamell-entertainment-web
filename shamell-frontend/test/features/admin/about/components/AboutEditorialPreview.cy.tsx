import { AboutEditorialPreview } from "@/features/admin/about/components/AboutEditorialPreview";
import { makeAdminAboutRow } from "@test/features/admin/about/support/fixtures/about.fixture";

type Props = React.ComponentProps<typeof AboutEditorialPreview>;

// Imagen local: next/image real no acepta hosts remotos fuera de remotePatterns.
const LOCAL_HERO = "/Logo.png";

function mountPreview(overrides: Partial<Props> = {}) {
  const props: Props = {
    record: makeAdminAboutRow({ imageUrl: LOCAL_HERO }),
    coreValuesList: ["Professionalism", "Excellence"],
    onEdit: cy.stub().as("onEdit"),
    onOpenLightbox: cy.stub().as("onOpenLightbox"),
    ...overrides,
  };
  cy.mount(<AboutEditorialPreview {...props} />);
}

function gridColumnCount() {
  return cy
    .get("[data-cy-root] > div")
    .then(($el) => getComputedStyle($el[0]).gridTemplateColumns.trim().split(/\s+/).length);
}

describe("AboutEditorialPreview (Cypress component)", () => {
  it("uses a 12-column grid on desktop and stacks on mobile", () => {
    cy.viewport(1280, 800);
    mountPreview();
    gridColumnCount().should("eq", 12);

    cy.viewport(375, 812);
    gridColumnCount().should("eq", 1);
  });

  it("loads the hero through next/image in a real browser", () => {
    mountPreview();
    cy.get('[aria-label="View enlarged photo"] img')
      .should("be.visible")
      .and(($img) => {
        expect(($img[0] as HTMLImageElement).naturalWidth).to.be.greaterThan(0);
      });
  });

  it("opens the lightbox for an image hero", () => {
    mountPreview();
    cy.get('[aria-label="View enlarged photo"]').click();
    cy.get("@onOpenLightbox").should("have.been.calledOnceWith", LOCAL_HERO, false);
  });

  it("calls onEdit from the Edit block button", () => {
    mountPreview();
    cy.contains("button", /edit block/i).click();
    cy.get("@onEdit").should("have.been.calledOnce");
  });

  it("shows the empty media placeholder without a hero url", () => {
    mountPreview({ record: makeAdminAboutRow({ imageUrl: null }) });
    cy.contains(/no photo or video/i).should("be.visible");
  });
});
