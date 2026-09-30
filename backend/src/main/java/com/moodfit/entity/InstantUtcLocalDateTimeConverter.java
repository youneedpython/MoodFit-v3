package com.moodfit.entity;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class InstantUtcLocalDateTimeConverter implements AttributeConverter<Instant, LocalDateTime> {

    @Override
    public LocalDateTime convertToDatabaseColumn(Instant attribute) {
        if (attribute == null) {
            return null;
        }
        return LocalDateTime.ofInstant(attribute.truncatedTo(ChronoUnit.MICROS), ZoneOffset.UTC);
    }

    @Override
    public Instant convertToEntityAttribute(LocalDateTime dbData) {
        if (dbData == null) {
            return null;
        }
        return dbData.toInstant(ZoneOffset.UTC);
    }
}
