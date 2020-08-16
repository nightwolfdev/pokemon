import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { BehaviorSubject, combineLatest, concat, Observable, of } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';

export interface Pokemon {
    abilities: ApiResult[];
    height: string; // Converted to inches.
    name: string;
    moves: ApiResult[];
    sprites: {
        back_default: string;
        back_female: string;
        back_shiny: string;
        back_shiny_female: string;
        front_default: string;
        front_female: string;
        front_shiny: string;
        front_shiny_female: string;
    }; 
    stats: {
        base_stat: number;
        effort: number;
        stat: {
            name: string;
            url: string;
        }
    }[];
    types: ApiResult[];
    weight: string; // Converted to pounds.
}

interface ApiPokemonResponse {
    abilities: {
        ability: ApiResult;
    }[];
    forms: ApiResult[];
    game_indices: any[];
    height: number; // Decimeters
    held_items: any[];
    id: number;
    is_default: boolean;
    location_area_encounters: string;
    moves: {
        move: ApiResult;
    }[];
    name: string;
    order: number;
    species: ApiResult;
    sprites: {
        back_default: string;
        back_female: string;
        back_shiny: string;
        back_shiny_female: string;
        front_default: string;
        front_female: string;
        front_shiny: string;
        front_shiny_female: string;
    };
    stats: {
        base_stat: number;
        effort: number;
        stat: ApiResult;
    }[];
    types: {
        type: ApiResult;
    }[];
    weight: number; // Hectograms
}

interface ApiResponse {
    count: number;
    next: string;
    previous: string;
    results: ApiResult[];
}

export interface ApiResult {
    image?: string;
    name: string;
    url: string;
}

interface ApiTypeResponse {
    damange_relations: any;
    game_indices: any[];
    generation: any;
    id: number;
    move_damage_class: any;
    moves: ApiResult[];
    name: string;
    names: any[];
    pokemon: {
        pokemon: ApiResult;
    }[];
}

interface PokemonCache {
    [name: string]: Pokemon;
}

interface PokemonListCache {
    [type: string]: ApiResult[];
}

@Injectable({
    providedIn: 'root'
})
export class PokemonService {

    constructor(private http: HttpClient) {}

    private baseUrl = 'https://pokeapi.co/api/v2';
    private baseImageUrl = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

    private pokemonListCache = new BehaviorSubject<PokemonListCache>({});
    private pokemonCache = new BehaviorSubject<PokemonCache>({});

    private searchSource = new BehaviorSubject<string>('');
    private searchTerm$ = this.searchSource.asObservable();

    private selectedTypeSource = new BehaviorSubject<string>('electric');
    private selectedType$ = this.selectedTypeSource.asObservable();

    private selectedPokemonSource = new BehaviorSubject<string>(null);
    private selectedPokemon$ = this.selectedPokemonSource.asObservable();

    pokemon$ = this.getPokemon();

    pokemonList$ = combineLatest(
        this.getPokemonList(),
        this.searchTerm$
    ).pipe(
        map(([pokemon, searchTerm]) => {
            if (!pokemon) { 
                // Return without filtering.
                return pokemon; 
            }

            return pokemon.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        }),
        shareReplay()
    );

    types$ = this.getTypes();

    // Update the selected pokemon.
    changePokemon(pokemon: string): void {
        this.selectedPokemonSource.next(pokemon);
    }

    // Update the selected type.
    changeType(type: string): void {
        this.selectedTypeSource.next(type);
    }

    // Get the current search term.
    getCurrentSearch(): string {
        return this.searchSource.getValue();
    }

    // Get the currently selected type.
    getCurrentType(): string {
        return this.selectedTypeSource.getValue();
    }

    // Get the current pokemon cache.
    getPokemonCache(): PokemonCache {
        return this.pokemonCache.getValue();
    }

    // Get the current pokemon list cache.
    getPokemonListCache(): PokemonListCache {
        return this.pokemonListCache.getValue();
    }

    // Update the search term.
    search(term: string): void {
        this.searchSource.next(term);
    }

    // Get the pokemon details based on the selected name.
    private getPokemon(): Observable<Pokemon> {
        return this.selectedPokemon$.pipe(
            switchMap(name => {
                const cache = this.getPokemonCache();

                // If the pokemon already exists in the cache, return the cached data.
                if (cache[name]) {
                    return of(cache[name]);
                }

                return this.getPokemonByName(cache, name);
            })
        );
    }

    // Api request to get the details of the pokemon by name.
    private getPokemonByName(cache: PokemonCache, name: string): Observable<Pokemon> {
        return this.http.get<ApiPokemonResponse>(`${this.baseUrl}/pokemon/${name}`).pipe(
            map(response => {
                const pokemon = {
                    abilities: [],
                    height: null,
                    name: response.name,
                    moves: [],
                    sprites: response.sprites,
                    stats: response.stats,
                    types: [],
                    weight: `${(response.weight / 4.536).toFixed(2)} pounds`
                };

                if (response.abilities) {
                    pokemon.abilities = response.abilities.map(entry => entry.ability).sort(this.sortNames);
                }

                if (response.height) {
                    let heightInches = response.height * 3.937;
                    const heightFeet = Math.floor(heightInches / 12);
                    heightInches %= 12
    
                    pokemon.height = `${heightFeet >= 1 ? heightFeet + (heightFeet === 1 ? ' foot' : ' feet') : ''} ${heightInches.toFixed(2)} ${heightInches === 1 ? 'inch' : 'inches'}`
    
                }

                if (response.moves) {
                    pokemon.moves = response.moves.map(entry => entry.move).sort(this.sortNames);
                }

                if (response.types) {
                    pokemon.types = response.types.map(entry => entry.type).sort(this.sortNames);
                }

                // Update the cache.
                const newCache = { ...cache };
                newCache[name] = pokemon;

                this.pokemonCache.next(newCache);

                return pokemon;
            })
        );
    }

    // Api request to get the list of pokemon by type.
    private getPokemonByType(cache: PokemonListCache, type: string): Observable<ApiResult[]> {
        return this.http.get<ApiTypeResponse>(`${this.baseUrl}/type/${type}`).pipe(
            map(response => {
                const pokemon = response.pokemon.map(entry => ({
                    ...entry.pokemon,
                    image: `${this.baseImageUrl}/${parseInt(entry.pokemon.url.split('/')[6])}.png`
                })).sort(this.sortNames);

                // Update the cache.
                const newCache = { ...cache };
                newCache[type] = pokemon;

                this.pokemonListCache.next(newCache);

                return pokemon;
            })
        );
    }

    // Get the pokemon list based on the selected type.
    private getPokemonList(): Observable<ApiResult[]> {
        return this.selectedType$.pipe(
            switchMap(type => {
                const cache = this.getPokemonListCache();

                // Clear the current search value so it doesn't try filtering the list of pokemon.
                this.search('');

                // If the type already exists in the cache, return the cached data.
                if (cache[type]) {
                    return of(cache[type]);
                }

                // Return null first to force the loading spinner to display.
                return concat(
                    of(null), 
                    this.getPokemonByType(cache, type)
                );
            })
        );
    }

    // Get all types.
    private getTypes(): Observable<ApiResult[]> {
        return this.http
            .get<ApiResponse>(`${this.baseUrl}/type/?limit=9999`)
            .pipe(
                map(response => response.results.sort(this.sortNames)),
                shareReplay()
            );
    }

    // Sort by name.
    private sortNames(a: ApiResult, b: ApiResult): number {
        if (a.name < b.name) {
            return -1;
        }

        if (a.name > b.name) {
            return 1;
        }

        return 0;
    }

}
