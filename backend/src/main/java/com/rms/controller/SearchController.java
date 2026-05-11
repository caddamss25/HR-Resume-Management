package com.rms.controller;

import com.rms.dto.CandidateDTO;
import com.rms.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private SearchService searchService;

    /**
     * GET /api/search?keyword=react&skill=Java&role=Backend&minExp=2
     * All parameters are optional. Returns matching candidates with resume links.
     */
    @GetMapping
    public ResponseEntity<List<CandidateDTO>> search(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String skill,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Integer minExp,
            @RequestParam(required = false) String status) {

        List<CandidateDTO> results = searchService.search(keyword, skill, role, minExp, status);
        return ResponseEntity.ok(results);
    }
}
