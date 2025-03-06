package group_3.tierlistservice.controller;

import group_3.tierlistservice.dto.TierlistItemRequest;
import group_3.tierlistservice.dto.TierlistItemResponse;
import group_3.tierlistservice.service.TierlistItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/items")
@RequiredArgsConstructor
@CrossOrigin
public class TierlistItemController {

    private final TierlistItemService itemService;

    @PostMapping
    public ResponseEntity<TierlistItemResponse> createItem(
            @Valid @RequestBody TierlistItemRequest request,
            @RequestHeader("X-User-ID") String userId) {
        TierlistItemResponse response = itemService.createItem(request, userId);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TierlistItemResponse> getItemById(@PathVariable String id) {
        TierlistItemResponse response = itemService.getItemById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user")
    public ResponseEntity<List<TierlistItemResponse>> getItemsByCreator(
            @RequestHeader("X-User-ID") String userId) {
        List<TierlistItemResponse> responses = itemService.getItemsByCreator(userId);
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TierlistItemResponse> updateItem(
            @PathVariable String id,
            @Valid @RequestBody TierlistItemRequest request,
            @RequestHeader("X-User-ID") String userId) {
        TierlistItemResponse response = itemService.updateItem(id, request, userId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteItem(
            @PathVariable String id,
            @RequestHeader("X-User-ID") String userId) {
        itemService.deleteItem(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<TierlistItemResponse>> searchItems(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String tag) {
        List<TierlistItemResponse> responses;

        if (name != null && !name.isEmpty()) {
            responses = itemService.searchItemsByName(name);
        } else if (tag != null && !tag.isEmpty()) {
            responses = itemService.searchItemsByTag(tag);
        } else {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(responses);
    }

    @PostMapping("/batch")
    public ResponseEntity<List<TierlistItemResponse>> getItemsByIds(
            @RequestBody List<String> ids) {
        if (ids == null || ids.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        List<TierlistItemResponse> responses = itemService.getItemsByIds(ids);
        return ResponseEntity.ok(responses);
    }
}