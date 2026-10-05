package com.odfe.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppUserProfile {
    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private boolean archived;
}
