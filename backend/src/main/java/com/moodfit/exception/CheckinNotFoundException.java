package com.moodfit.exception;

public class CheckinNotFoundException extends RuntimeException {

    public CheckinNotFoundException() {
        super("Latest check-in was not found.");
    }
}
