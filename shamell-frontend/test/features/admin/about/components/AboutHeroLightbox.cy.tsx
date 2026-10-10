import { AboutHeroLightbox } from "@/features/admin/about/components/AboutHeroLightbox";

type Props = React.ComponentProps<typeof AboutHeroLightbox>;

function mountLightbox(overrides: Partial<Props> = {}) {
  const props: Props = {
    portalReady: true,
    isOpen: true,
    display: { src: "/Logo.png", isVideo: false },
    onClose: cy.stub().as("onClose"),
    onExitComplete: cy.stub().as("onExitComplete"),
    ...overrides,
  };
  cy.mount(<AboutHeroLightbox {...props} />);
}

describe("AboutHeroLightbox (Cypress component)", () => {
  it("renders nothing until the portal is ready", () => {
    mountLightbox({ portalReady: false });
    cy.get('[aria-label="Close preview"]').should("not.exist");
  });

  it("shows the expanded image as a fixed full-screen overlay", () => {
    mountLightbox();
    cy.get('img[alt="Expanded About view"]').should("be.visible");
    cy.get('[role="presentation"]').should("have.css", "position", "fixed");
  });

  it("renders a video element for video display", () => {
    mountLightbox({ display: { src: "/hero.mp4", isVideo: true } });
    cy.get('video[aria-label="Expanded About view"]').should("exist");
  });

  it("calls onClose from the close button", () => {
    mountLightbox();
    cy.get('[aria-label="Close preview"]').click();
    cy.get("@onClose").should("have.been.calledOnce");
  });

  it("calls onClose when clicking the backdrop but not the content", () => {
    mountLightbox();
    cy.get('img[alt="Expanded About view"]').click();
    cy.get("@onClose").should("not.have.been.called");
    cy.get('[role="presentation"]').click("topLeft");
    cy.get("@onClose").should("have.been.calledOnce");
  });
});
