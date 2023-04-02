import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export class Context {
    constructor() {

        // Setup app
        initializeApp();

        this.database = getFirestore();
    }
}