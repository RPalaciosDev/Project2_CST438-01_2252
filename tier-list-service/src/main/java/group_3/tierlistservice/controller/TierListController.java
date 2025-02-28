package group_3.tierlistservice.controller;

import group_3.tierlistservice.dto.TierListRequest;
import group_3.tierlistservice.dto.TierListResponse;
import group_3.tierlistservice.service.TierListService;
import group_3.tierlistservice.mapper.TierListMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tierlists")
@RequiredArgsConstructor
public class TierListController {

    private final TierListService tierListService;
    private final TierListMapper tierListMapper;

    @PostMapping
    public ResponseEntity<TierListResponse> createTierList(
            @Valid @RequestBody TierListRequest request,
            @RequestHeader("X-User-Id") String userId) {
        return ResponseEntity.ok(
                tierListMapper.toResponse(
                        tierListService.createTierList(
                                tierListMapper.toEntity(request, userId))));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TierListResponse> updateTierList(
            @PathVariable String id,
            @Valid @RequestBody TierListRequest request,
            @RequestHeader("X-User-Id") String userId) {
        return tierListService.updateTierList(id, tierListMapper.toEntity(request, userId))
                .map(tierListMapper::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TierListResponse> getTierList(@PathVariable String id) {
        return tierListService.getTierList(id)
                .map(tierListMapper::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<TierListResponse>> getUserTierLists(@PathVariable String userId) {
        return ResponseEntity.ok(
                tierListService.getUserTierLists(userId).stream()
                        .map(tierListMapper::toResponse)
                        .collect(Collectors.toList()));
    }

    @GetMapping("/public")
    public ResponseEntity<List<TierListResponse>> getPublicTierLists() {
        return ResponseEntity.ok(
                tierListService.getPublicTierLists().stream()
                        .map(tierListMapper::toResponse)
                        .collect(Collectors.toList()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<TierListResponse>> searchTierLists(@RequestParam String query) {
        return ResponseEntity.ok(
                tierListService.searchTierLists(query).stream()
                        .map(tierListMapper::toResponse)
                        .collect(Collectors.toList()));
    }

    @GetMapping("/tag/{tag}")
    public ResponseEntity<List<TierListResponse>> getTierListsByTag(@PathVariable String tag) {
        return ResponseEntity.ok(
                tierListService.getTierListsByTag(tag).stream()
                        .map(tierListMapper::toResponse)
                        .collect(Collectors.toList()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTierList(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId) {
        tierListService.deleteTierList(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/collaborative/{userId}")
    public ResponseEntity<List<TierListResponse>> getCollaborativeTierLists(@PathVariable String userId) {
        return ResponseEntity.ok(
                tierListService.getCollaborativeTierLists(userId).stream()
                        .map(tierListMapper::toResponse)
                        .collect(Collectors.toList()));
    }
}