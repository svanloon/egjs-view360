import {expect} from "chai";
import sinon from "sinon";
import WebGLAnimatorInjector from "inject-loader!../../../src/PanoImageRenderer/WebGLAnimator"; // eslint-disable-line import/no-duplicates
import WebGLAnimator from "../../../src/PanoImageRenderer/WebGLAnimator"; // eslint-disable-line import/no-duplicates
import WebGLUtils from "../../../src/PanoImageRenderer/WebGLUtils";

const WEBGL_AVAILABILITY = WebGLUtils.isWebGLAvailable();
const IT = WEBGL_AVAILABILITY ? it : it.skip;

describe("WebGLAnimator", () => {
	it("should have window as default context", async () => {
		// Given
		const animator = new WebGLAnimator();
		const rafSpy = sinon.spy(window, "requestAnimationFrame");

		// When
		animator.start();

		await new Promise(res => {
			setTimeout(res, 100); // Loop for some time
		});

		animator.stop();

		// Then
		expect(rafSpy.called).to.be.true;
	});

	it("can change context", async () => {
		// Given
		const animator = new WebGLAnimator();
		const rafStub = sinon.stub();
		const someContext = {
			requestAnimationFrame: rafStub,
		};

		rafStub.onCall(() => {
			setTimeout(() => {}, 0);
		});

		// When
		animator.setContext(someContext);
		animator.setCallback(() => {});
		animator.start();

		await new Promise(res => {
			setTimeout(res, 100); // Loop for some time
		});

		animator.stop();

		// Then
		expect(rafStub.called).to.be.true;
	});

	IT("should invoke renderLoopTimer if rendering frame is too delayed on PC Safari Browser", async () => {
		// Given
		const WebGLAnimatorOnSafari = WebGLAnimatorInjector({
			"../utils/browser": {
				IS_SAFARI_ON_DESKTOP: true
			}
		}).default;

		const inst = new WebGLAnimatorOnSafari();

		// When
		// 1) Apply slow rendering
		/**
		 * Delaying a frame with '20 ms' by force.
		 */
		inst.setCallback(() => {
			const start = Date.now();
			let now = start;

			/** */
			while (now - start < 20) {
				now = Date.now();
			}
		});

		inst.start();
		await new Promise(res => setTimeout(res, 100));

		const timerId1 = inst._rafTimer;

		inst.stop();

		// 2) Apply original render (fast render)
		inst.setCallback(() => {});

		inst.start();
		await new Promise(res => setTimeout(res, 100));
		inst.stop();

		const timerId2 = inst._rafTimer;

		// This cannot be tested by BLACKBOX-TEST
		expect(timerId1).not.equals(-1);
		expect(timerId2).equals(-1);
	});
});
